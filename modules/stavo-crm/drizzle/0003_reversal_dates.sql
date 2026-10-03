-- Corrige a data dos estornos ja gravados.
--
-- Ate aqui o estorno era datado no dia em que foi feito, enquanto o pagamento
-- que ele anula ficava na data original. O resultado era um periodo com
-- receita NEGATIVA (so o estorno) e outro inflado (so o pagamento), quando na
-- pratica nada entrou.
--
-- Casando as duas linhas na mesma data elas se anulam onde precisam se anular.
-- `created_at` nao e tocado: continua registrando quando o estorno aconteceu.
--
-- Migracao de DADOS, sem alteracao de schema. E idempotente: rodar de novo
-- nao encontra linha para atualizar.
UPDATE `payments` AS `estorno`
  JOIN `payments` AS `original` ON `original`.`id` = `estorno`.`reversal_of_id`
   SET `estorno`.`payment_date` = `original`.`payment_date`
 WHERE `estorno`.`status` = 'REVERSAL'
   AND `estorno`.`payment_date` <> `original`.`payment_date`;
